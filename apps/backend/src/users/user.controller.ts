import { Router } from 'express';
import type { Request, Response } from 'express';
import { UserApi } from './user.service';
import type {
  UserApiFindUserParams,
  UserApiFindUsersParams,
  UserApiCreateUserParams,
  UserApiUpdateUserParams,
  UserApiDeleteUserParams,
} from './user.params';

export const userController = Router();
const userApi = new UserApi();

userController.get('/user', async (req: Request, res: Response) => {
  try {
    const query = req.body;
    if (Object.keys(query).length > 0) {
      const user = await userApi.findUser(query as UserApiFindUserParams);
      res.json(user);
      res.status(200).end();
    } else {
      res.send('ID_OR_NAME_NOT_SET');
      res.status(400).end();
    }
  } catch (err) {
    res.send('INTERNAL_ERROR');
    res.status(500).end();
  }
});

userController.get('/users', async (req: Request, res: Response) => {
  try {
    const query = req.body;
    if (Object.keys(query).length > 0) {
      const users = await userApi.findUsers(query as UserApiFindUsersParams);
      res.json(users);
      res.status(200).end();
    } else {
      res.send('IDS_OR_NAMES_NOT_SET');
      res.status(400).end();
    }
  } catch (err) {
    res.send('INTERNAL_ERROR');
    res.status(500).end();
  }
});

userController.post('/new-user', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const newUser = await userApi.createUser(data as UserApiCreateUserParams);
    res.json(newUser);
    res.status(201).end();
  } catch (err) {
    res.send('INTERNAL_ERROR');
    res.status(500).end();
  }
});

userController.put('/update-user/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const updatedUser = await userApi.updateUser({
      ...data,
      id,
    } as UserApiUpdateUserParams);
    res.json(updatedUser);
    res.status(201).end();
  } catch (err) {
    switch (err) {
      case 'USER_NOT_EXIST':
        res.send('USER_NOT_EXIST');
        res.status(400).end();
        break;
      case 'USER_ID_NOT_SET':
        res.send('USER_ID_NOT_SET');
        res.status(400).end();
        break;
      default:
        res.send('INTERNAL_ERROR');
        res.status(500).end();
    }
  }
});

userController.delete('/update-user/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (id) {
      const deletedUser = await userApi.deleteUser({ id } as UserApiDeleteUserParams);
      res.json(deletedUser);
      res.status(201).end();
    }
  } catch (err) {
    switch (err) {
      case 'USER_NOT_EXIST':
        res.send('USER_NOT_EXIST');
        res.status(400).end();
        break;
      case 'USER_ID_NOT_SET':
        res.send('USER_ID_NOT_SET');
        res.status(400).end();
        break;
      default:
        res.send('INTERNAL_ERROR');
        res.status(500).end();
    }
  }
});
