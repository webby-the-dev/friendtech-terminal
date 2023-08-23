import type { NextApiRequest, NextApiResponse } from "next";
import Cors from "cors";
import axios from "axios";
import { apiUrl } from "@/src/consants";

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
      apiUrl + `search/users?username=${req.query.username}`,
      {
        headers: {
          Authorization:
            process.env.NEXT_PUBLIC_FRIEND_TECH_AUTHORIZATION_TOKEN,
        },
      }
    );
    res.json(data.data.users);
  } catch (e) {
    res.json(e);
  }
}
