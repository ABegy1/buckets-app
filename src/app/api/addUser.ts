// src/pages/api/addUser.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { createUser } from '@/db/queries';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const userData = req.body;

    try {
      await createUser(userData);
      res.status(200).json({ message: 'User added successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to add user' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
