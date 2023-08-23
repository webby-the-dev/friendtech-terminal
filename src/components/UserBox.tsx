import { Grid, Flex, Button, Image, Text, Link, Box } from "@chakra-ui/react";
import { User } from "../types";

interface UserBoxProps {
  user: User;
  privateKey: string;
  userAddress: string;
  userShares: any;
  realTime?: boolean;
  isDetails?: boolean;
  buyShares: (address: string, amount: number) => void;
  sellShares: (address: string, amount: number) => void;
  selectUserAddress: (address: string) => void;
}

export const UserBox = (props: UserBoxProps) => {
  const {
    realTime = false,
    isDetails = false,
    user,
    userShares,
    userAddress,
    privateKey,
    buyShares,
    sellShares,
    selectUserAddress,
  } = props;

  return (
    <Grid
      p={4}
      bg="rgba(255,255,255,0.2)"
      borderRadius={10}
      gap={2}
      m={2}
      cursor={isDetails ? "default" : "pointer"}
      onClick={isDetails ? () => {} : () => selectUserAddress(user.address)}
    >
      <Flex alignItems="center" gap={2}>
        <Image
          src={user.twitterPfpUrl}
          alt={user.twitterPfpUrl}
          width={30}
          height={30}
          borderRadius={20}
        />
        <Text> {user.twitterName}</Text>
        {realTime && (
          <Text
            textAlign="center"
            fontWeight={600}
            color="yellow.500"
            className="blink-text"
            ml="auto"
            mr={0}
          >
            Real time data!
          </Text>
        )}
        {user.foundAt && (
          <Text ml="auto" mr={0}>
            {user.foundAt.format("HH:mm:ss")} {user.foundAt.fromNow()}
          </Text>
        )}
      </Flex>
      <Flex alignItems="center" gap={1}>
        <Text>Twitter: </Text>
        <Link
          href={`https://twitter.com/${user.twitterUsername}`}
          color="blue.300"
          isExternal
        >
          @{user.twitterUsername}
        </Link>
      </Flex>
      {user.followers !== undefined && <Text>Followers: {user.followers}</Text>}
      <Flex alignItems="center" gap={1}>
        <Text>User address: </Text>
        <Link
          href={`https://basescan.org/address/${user.address}`}
          color="blue.300"
          isExternal
        >
          {user.address.slice(0, 5)}...{user.address.slice(-5)}{" "}
        </Link>
      </Flex>

      <Flex alignItems="center" gap={1}>
        <Text>Friend tech link: </Text>
        <Link
          href={`https://www.friend.tech/rooms/${user.address}`}
          color="blue.300"
          isExternal
        >
          Link
        </Link>
      </Flex>
      {user.holderCount ? <Text>Holder count: {user.holderCount}</Text> : null}
      {user.shareSupply ? <Text>Share supply: {user.shareSupply}</Text> : null}
      {user.displayPrice ? (
        <Text>Price: {user.displayPrice / 1000000000000000000} ETH</Text>
      ) : null}
      <Flex gap={2}>
        <Button
          size="sm"
          onClick={() => buyShares(user.address, 1)}
          isDisabled={!privateKey || !userAddress}
          bgColor="green"
        >
          Buy shares
        </Button>
        {userShares.find(
          (share: any) => share.twitterName === user.twitterName
        ) && (
          <Button
            size="sm"
            onClick={() => sellShares(user.address, 1)}
            isDisabled={!privateKey}
            bgColor="red"
          >
            Sell shares
          </Button>
        )}
      </Flex>
      {!isDetails && (
        <Box ml="auto" mr={0}>
          <Button size="sm" onClick={() => selectUserAddress(user.address)}>
            Details
          </Button>
        </Box>
      )}
    </Grid>
  );
};
