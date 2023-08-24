import { Filters } from "@/src/components/Filters";
import { UserBox } from "@/src/components/UserBox";
import {
  buyShares,
  contract,
  sellShares,
  setupContract,
  setupWallet,
} from "@/src/friendTechContract";
import { FilterType, TwitterUserResponse, User } from "@/src/types";
import {
  Button,
  Flex,
  Grid,
  Input,
  Link,
  Spinner,
  Stack,
  Text,
  useToast,
} from "@chakra-ui/react";
import axios, { CancelTokenSource } from "axios";
import { ethers } from "ethers";
import { debounce, uniqBy } from "lodash";
import moment from "moment";
import { useEffect, useRef, useState } from "react";
import { BsDiscord, BsGithub } from "react-icons/bs";

let cancelToken: CancelTokenSource | undefined;

export default function Home() {
  const [users, setUsers] = useState<User[]>([]);
  const [userAddress, setUserAddress] = useState("");
  const [privateKey, setPrivateKey] = useState<string>("");
  const [userShares, setUserShares] = useState([]);
  const [filters, setFilters] = useState<FilterType[]>(["all"]);
  const [searchString, setSearchString] = useState("");
  const [selectedUserAddress, setSelectedUserAddress] = useState<string>("");
  const [selectedUserData, setSelectedUserData] = useState<User | undefined>(
    undefined
  );
  const [usersSearchString, setUsersSearchString] = useState("");
  const [searchedUsers, setSearchedUsers] = useState<User[]>([]);
  const toast = useToast();

  useEffect(() => {
    let eventQueue: any[] = [];

    const processEvent = async (event: any) => {
      try {
        await axios
          .get(`https://prod-api.kosetto.com/users/${event.traderAddress}`)
          .then((data) => {
            setUsers((prev) => [{ ...data.data, foundAt: moment() }, ...prev]);
            axios
              .get<TwitterUserResponse>(`/api/getTwitterFollowers`, {
                params: { profileName: data.data.twitterUsername },
              })
              .then((followersData) => {
                setUsers((prev) => {
                  const newUsers = [...prev];
                  const user = newUsers.find(
                    (user) => user.twitterUsername === data.data.twitterUsername
                  );
                  if (user) {
                    user.followers = followersData.data.followers_count;
                  }
                  return newUsers;
                });
              });
          });
      } catch (err) {
        console.log(err);
      }
      checkQueue();
    };

    const checkQueue = async () => {
      if (eventQueue.length > 0) {
        eventQueue = uniqBy(eventQueue, "traderAddress");
        const nextEvent = eventQueue.shift();
        await processEvent(nextEvent);
      }
    };

    contract.on(
      "Trade",
      async (
        trader,
        subject,
        isBuy,
        shareAmount,
        ethAmount,
        protocolEthAmount,
        subjectEthAmount,
        supply
      ) => {
        const basicTradeDetails = {
          traderAddress: trader,
          subjectAddress: subject,
          isBuy: isBuy ? "Buy" : "Sell",
          shareAmount,
          ethAmount: ethers.formatEther(ethAmount),
          protocolEthAmount: ethers.formatEther(protocolEthAmount),
          subjectEthAmount: ethers.formatEther(subjectEthAmount),
          supply,
        };

        if (
          basicTradeDetails.traderAddress ===
            basicTradeDetails.subjectAddress &&
          basicTradeDetails.isBuy === "Buy" &&
          basicTradeDetails.ethAmount === "0.0" &&
          basicTradeDetails.shareAmount === 1n &&
          basicTradeDetails.supply === 1n
        ) {
          eventQueue.push({ ...basicTradeDetails });

          checkQueue();
        }
      }
    );
  }, []);

  useEffect(() => {
    if (users.length > 20) {
      setUsers(users.slice(0, 20));
    }
  }, [users]);

  const usersRef = useRef(users);

  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  const fetchSelectedUserData = async () => {
    setSelectedUserAddress((actual) => {
      axios.get(`https://prod-api.kosetto.com/users/${actual}`).then((data) => {
        setSelectedUserData(data.data);
      });

      return actual;
    });
  };

  useEffect(() => {
    let fetchInterval: NodeJS.Timeout;
    if (selectedUserAddress) {
      fetchSelectedUserData();

      fetchInterval = setInterval(() => {
        fetchSelectedUserData();
      }, 3000);
    }

    return () => clearInterval(fetchInterval);
  }, [selectedUserAddress]);

  const getUserShares = () =>
    axios
      .get("/api/getUserShares", {
        params: { address: userAddress },
      })
      .then((res) => setUserShares(res.data));

  useEffect(() => {
    if (privateKey && userAddress) {
      getUserShares();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [privateKey, userAddress]);

  const handleSavePrivateKeyLocally = async () => {
    const wallet = await setupWallet(privateKey);
    setUserAddress(wallet.address);
    setupContract(privateKey);
  };

  const handleBuyShares = async (address: string, numOfShares: number) => {
    await buyShares(address, numOfShares, toast, getUserShares);
  };

  const handleSellShares = async (address: string, numOfShares: number) => {
    await sellShares(address, numOfShares, toast, getUserShares);
  };

  const searchUsers = async (string: string) => {
    if (typeof cancelToken != typeof undefined) {
      cancelToken!.cancel("Operation canceled due to new request.");
    }

    cancelToken = axios.CancelToken.source();

    return axios
      .get("/api/searchUsers", {
        params: { username: string },
        cancelToken: cancelToken.token,
      })
      .then((res) => res.data);
  };

  const debouncedSearch = debounce(async (string: string) => {
    if (!string) return;
    try {
      const data = await searchUsers(string);
      setSearchedUsers(data);
    } catch (err) {
      if (axios.isCancel(err)) {
        console.log("Request canceled", err.message);
      } else {
        console.error(err);
      }
    }
  }, 300);

  const handleUsersSearchString = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsersSearchString(e.target.value);
    debouncedSearch(e.target.value);
  };

  const filterFunctions: {
    [key in FilterType]: (user: User) => boolean;
  } = {
    all: () => true,
    "5k": (user: User) => user.followers >= 5000 && user.followers < 10000,
    "10k": (user: User) => user.followers >= 10000,
  };

  const filteredUsers = uniqBy(
    users
      .filter((user) =>
        filters.every((filter) => filterFunctions[filter](user))
      )
      .filter(
        (user) =>
          user.twitterName.toLowerCase().includes(searchString.toLowerCase()) ||
          user.twitterUsername
            .toLowerCase()
            .includes(searchString.toLowerCase()) ||
          user.address.toLowerCase().includes(searchString.toLowerCase())
      ),
    "id"
  );

  return (
    <Grid gap={4}>
      <Flex gap={4} alignItems="center" justifyContent="center" py={4}>
        <Flex alignItems="center" gap={1} color="#fff">
          <Text fontSize="md">Open source repo:</Text>
          <BsGithub />
          <Link
            textDecoration="underline"
            href="https://github.com/webby-the-dev/friendtech-terminal"
            target="_blank"
          >
            Link
          </Link>
        </Flex>
        <Flex alignItems="center" gap={1} color="#fff">
          <Text fontSize="md">Author:</Text>
          <BsGithub />
          <Link
            textDecoration="underline"
            href="https://github.com/webby-the-dev"
            target="_blank"
          >
            Webby-the-dev
          </Link>
        </Flex>

        <Flex alignItems="center" gap={1} color="#fff">
          <BsDiscord />
          <Text fontSize="md">Discord:</Text>
          <Link
            textDecoration="underline"
            href="https://discord.gg/grmQhZBwWP"
            target="_blank"
          >
            Link
          </Link>
        </Flex>
      </Flex>
      <Flex gap={4}>
        <Grid gap={2} flex={1}>
          <Grid>
            <Text textAlign="center" p={2}>
              Last joined
            </Text>
            <Filters
              filters={filters}
              updateFilters={setFilters}
              searchString={searchString}
              setSearchString={setSearchString}
            />
          </Grid>
          <Flex
            justifyContent="center"
            gap={2}
            my={filteredUsers.length === 0 ? 8 : 0}
          >
            <Text fontStyle="italic" color="yellow.500">
              Watching for new users
            </Text>
            <Spinner color="yellow.500" />
          </Flex>
          <Grid
            gap={2}
            h="calc(100vh - 202px - 8px - 120px)"
            overflowY="scroll"
            className="scrollable-container"
          >
            <Stack>
              {filteredUsers.map((user, idx) => (
                <UserBox
                  privateKey={privateKey}
                  userAddress={userAddress}
                  userShares={userShares}
                  buyShares={handleBuyShares}
                  sellShares={handleSellShares}
                  user={user}
                  key={idx}
                  selectUserAddress={setSelectedUserAddress}
                />
              ))}
            </Stack>
          </Grid>
        </Grid>
        <Grid flex={1}>
          <Stack p={2}>
            <Text textAlign="center">User details</Text>
            {!selectedUserData && (
              <Text textAlign="center" fontStyle="italic">
                User not selected
              </Text>
            )}

            {selectedUserData && (
              <UserBox
                privateKey={privateKey}
                userAddress={userAddress}
                userShares={userShares}
                buyShares={handleBuyShares}
                sellShares={handleSellShares}
                user={{
                  ...selectedUserData,
                  followers:
                    users.find((u) => u.address === selectedUserData.address)
                      ?.followers ?? 0,
                }}
                realTime
                selectUserAddress={setSelectedUserAddress}
                isDetails
              />
            )}
          </Stack>
        </Grid>

        <Grid flex={0.5} p={2}>
          <Stack>
            <Text textAlign="center">My shares</Text>
            {(!privateKey || !userAddress) && (
              <Text textAlign="center" fontStyle="italic">
                No private key
              </Text>
            )}
            {userShares.map((share: any, idx) => (
              <Flex key={idx} alignItems="center" gap={2}>
                <Text>
                  {share.twitterName}: {share.balance}
                </Text>
                {share.address.toLowerCase() !== userAddress.toLowerCase() && (
                  <Button
                    size="sm"
                    onClick={() => handleSellShares(share.address, 1)}
                    isDisabled={!privateKey}
                    bgColor="red"
                  >
                    Sell shares
                  </Button>
                )}
              </Flex>
            ))}
          </Stack>
        </Grid>
        <Grid gap={2} flex={0.5}>
          <Stack p={2}>
            <Grid gap={2}>
              <Text textAlign="center">Search user</Text>
              <Flex gap={2}>
                <Input
                  size="sm"
                  placeholder="Username"
                  value={usersSearchString}
                  onChange={handleUsersSearchString}
                />
              </Flex>
            </Grid>
            <Grid
              gap={2}
              h="calc(100vh - 101px - 56px)"
              overflowY="scroll"
              className="scrollable-container"
            >
              <Stack>
                {searchedUsers?.length === 0 || !usersSearchString ? (
                  <Text fontStyle="italic" textAlign="center">
                    No users found
                  </Text>
                ) : (
                  searchedUsers?.map((user, idx) => (
                    <UserBox
                      privateKey={privateKey}
                      userAddress={userAddress}
                      userShares={userShares}
                      buyShares={handleBuyShares}
                      sellShares={handleSellShares}
                      user={user}
                      key={idx}
                      selectUserAddress={setSelectedUserAddress}
                    />
                  ))
                )}
              </Stack>
            </Grid>
          </Stack>
        </Grid>
        <Grid p={2} position="fixed" bottom={0} gap={2} width="100%">
          <Flex gap={2} alignItems="center" justifyContent="center">
            <Text>Private key</Text>
            <Input
              size="sm"
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              maxW="300px"
              type="password"
            />
            <Button onClick={() => handleSavePrivateKeyLocally()}>Save</Button>
          </Flex>
        </Grid>
      </Flex>
    </Grid>
  );
}
