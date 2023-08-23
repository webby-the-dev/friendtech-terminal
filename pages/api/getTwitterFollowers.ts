import axios from "axios";
import Cors from "cors";
import type { NextApiRequest, NextApiResponse } from "next";

const cors = Cors({
  methods: ["POST", "GET", "HEAD"],
});

function runMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  fn: Function
) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }

      return resolve(result);
    });
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await runMiddleware(req, res, cors);

  try {
    const data = await axios.get(
      `https://api.twitter.com/1.1/users/lookup.json?screen_name=${req.query.profileName}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_TWITTER_API_BEARER}`,
        },
      }
    );
    res.json(data.data[0]);
  } catch (e) {
    res.json(e);
  }
}
