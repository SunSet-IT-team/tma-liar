import jwt from "jsonwebtoken"; 
import dotenv from "dotenv"
import { UserApi } from "../users/user.service";
import type { 
    UserAuthLoginParams
} from './auth.params'
import { ApiError } from "../common/response";

dotenv.config();
const JWT_SECRET = process.env.SECRET || "super-secret"; 

/**
 * Интерфейс для авторизации
 */
export interface UserAuthMethods {
  userLogin: (param?: UserAuthLoginParams) => Promise<string | null>;
}

/**
 * Авторизация
 */
export class UserAuth implements UserAuthMethods { 
    constructor(private users: UserApi) {}

    public async userLogin(param?: UserAuthLoginParams) : Promise<string | null> { 
        if(!param?.telegramId) throw new ApiError(404, "ID_ERROR");

        const user = await this.users.findUser({ telegramId: param.telegramId });

        if(!user) throw new ApiError(404, "USER_NOT_REGISTERED");

        const token = jwt.sign(
            { userId: user._id.toString() }, 
            JWT_SECRET, 
            { expiresIn:"1d" }, 
        );

        return token;
    }
}