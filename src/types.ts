import moment from "moment";

export type User = {
  id: number;
  address: string;
  twitterUsername: string;
  twitterName: string;
  twitterPfpUrl: string;
  displayPrice: number;
  holderCount: number;
  shareSupply: number;
  followers: number;
  verified: boolean;
  foundAt: moment.Moment;
};

export type TwitterUserResponse = {
  followers_count: number;
  verified: boolean;
};

export type FilterType = "all" | "5k" | "10k";
