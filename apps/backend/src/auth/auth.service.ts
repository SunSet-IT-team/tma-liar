import jwt from "jsonwebtoken"; 
import dotenv from "dotenv"
import { UserApi } from "../users/user.service";
import type { 
    UserAuthLoginParams
} from './auth.params'
import { ApiError } from "../common/response";
import { UserModel } from "../users/user.modal";

dotenv.config();
const JWT_SECRET = process.env.SECRET || "super-secret"; 

/**
 * Интерфейс для авторизации
 */
export interface UserAuthMethods {
  userLogin: (param: UserAuthLoginParams) => Promise<string | null>;
}

/**
 * Авторизация
 */
export class UserAuth implements UserAuthMethods { 
    constructor(private users: UserApi) {}

    public async userLogin(param: UserAuthLoginParams) : Promise<string> { 
        const user = await UserModel.findOne({ telegramId: param.telegramId });

        if(!user) throw new ApiError(400, "USER_NOT_REGISTERED");

        const token = jwt.sign(
            { userId: user._id.toString() }, 
            JWT_SECRET, 
            { expiresIn:"1d" }, 
        );

        if (!token) {
            throw new ApiError(401, "AUTH_FAILED");
        }

        return token;
    }
}