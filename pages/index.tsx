import { Filters } from "@/src/components/Filters";
import { UserBox } from "@/src/components/UserBox";
import {
  buyShares,
  sellShares,
  setupContract,
  setupWallet,
} from "@/src/friendTechContract";
import { FilterType, User } from "@/src/types";
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
import { debounce, uniqBy } from "lodash";
import moment from "moment";
import { useEffect, useRef, useState } from "react";
import { BsDiscord, BsGithub, BsTwitter } from "react-icons/bs";
import { FaUserFriends } from "react-icons/fa";
import { io } from "socket.io-client";

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
    const URL = process.env.NEXT_PUBLIC_BACKEND_URL;

    if (!URL) {
      alert(
        "No backend URL provided! Please set the NEXT_PUBLIC_BACKEND_URL environment variable in .env file"
      );
      return;
    }

    const socket = io(URL);

    socket.on("connect", () => {
      console.log("Connected to the WebSocket server");
    });

    socket.on("newUser", async (data) => {
      setUsers((prev) => [{ ...data, foundAt: moment() }, ...prev]);
    });

    socket.on("error", (error) => {
      console.error("WebSocket error:", error);
    });

    socket.on("close", (event) => {
      if (event.wasClean) {
        console.log(
          `Closed cleanly, code=${event.code}, reason=${event.reason}`
        );
      } else {
        console.error("Connection died");
      }
    });

    return () => {
      socket.disconnect();
      socket.off();
    };
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
      }, 1000);
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

  const searchUsersByTwitterName = async (string: string) => {
    if (typeof cancelToken != typeof undefined) {
      cancelToken!.cancel("Operation canceled due to new request.");
    }

    cancelToken = axios.CancelToken.source();

    return axios
      .get("/api/searchUsers", {
        params: { twitterUsername: string },
        cancelToken: cancelToken.token,
      })
      .then((res) => res.data);
  };

  const searchUsersByAddress = async (string: string) => {
    if (typeof cancelToken != typeof undefined) {
      cancelToken!.cancel("Operation canceled due to new request.");
    }

    cancelToken = axios.CancelToken.source();

    return axios
      .get("/api/searchUsers", {
        params: { address: string },
        cancelToken: cancelToken.token,
      })
      .then((res) => res.data);
  };

  const debouncedSearch = debounce(async (string: string) => {
    if (!string) return;
    try {
      if (string.toLowerCase().startsWith("0x")) {
        const data = await searchUsersByAddress(string);
        setSearchedUsers([data]);
      } else {
        const data = await searchUsersByTwitterName(string);
        console.log("dadsad", data);
        setSearchedUsers(data);
      }
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
    "5k": (user: User) =>
      user.followers ? user.followers >= 5000 && user.followers < 10000 : false,
    "10k": (user: User) => (user.followers ? user.followers >= 10000 : false),
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
          <BsGithub />
          <Link
            textDecoration="underline"
            href="https://github.com/webby-the-dev/friendtech-terminal"
            target="_blank"
          >
            Open source
          </Link>
        </Flex>

        <Flex alignItems="center" gap={1} color="#fff">
          <BsTwitter />
          <Link
            textDecoration="underline"
            href="https://twitter.com/webby_the_dev"
            target="_blank"
          >
            Author
          </Link>
        </Flex>

        <Flex alignItems="center" gap={1} color="#fff">
          <FaUserFriends />
          <Link
            textDecoration="underline"
            href="https://www.friend.tech/rooms/0xFe0a69518CaE0174BF52481545A5c547DD3f252C"
            target="_blank"
          >
            My friend.tech
          </Link>
        </Flex>

        <Flex alignItems="center" gap={1} color="#fff">
          <BsDiscord />
          <Link
            textDecoration="underline"
            href="https://discord.gg/grmQhZBwWP"
            target="_blank"
          >
            Discord
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
            alignItems="center"
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
                      ?.followers ?? undefined,
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
        <Grid gap={2} flex={1}>
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
        <Grid
          p={2}
          position="fixed"
          bottom={0}
          gap={2}
          width="100%"
          justifyContent="center"
        >
          <Flex gap={2} alignItems="center" justifyContent="center">
            <Text>Private key</Text>

            <Input
              size="sm"
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              maxW="300px"
              type="password"
            />
            <Button size="sm" onClick={() => handleSavePrivateKeyLocally()}>
              Save
            </Button>
          </Flex>
          <Text textAlign="center" color="yellow.500" fontWeight={600}>
            The code is{" "}
            <Link
              textDecoration="underline"
              href="https://github.com/webby-the-dev/friendtech-terminal"
              target="_blank"
            >
              open-source
            </Link>
            , which proves we <span style={{ color: "red" }}>DO NOT</span> store
            your private key anywhere. <br /> It is stored only locally in your
            browser and is cleared every time you refresh the page.
          </Text>
        </Grid>
      </Flex>
    </Grid>
  );
}
