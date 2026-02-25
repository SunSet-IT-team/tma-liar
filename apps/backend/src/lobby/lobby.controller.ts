import type { Request, Response } from 'express';
import { LobbyService } from './lobby.service';
import { ApiError, success } from '../common/response';
import { CreateLobbyDtoSchema, type CreateLobbyDto } from './dtos/lobby-create.dto';
import { FindLobbyDtoSchema, type FindLobbyDto } from './dtos/lobby-find.dto';
import { JoinLobbyDtoSchema, type JoinLobbyDto } from './dtos/lobby-join.dto';
import { UpdateLobbyDtoSchema, type UpdateLobbyDto } from './dtos/lobby-update.dto';
import { DeleteLobbyDtoSchema, type DeleteLobbyDto } from './dtos/lobby-delete.dto';

/**
 * Класс контроллеров лобби
 */
export class LobbyController { 
  /**
   * Контроллер получения одного лобби
   */

  constructor(private readonly lobbyService = new LobbyService()) {}

  public async findLobby(req: Request, res: Response) {
    const result = FindLobbyDtoSchema.safeParse({ lobbyCode: req.params.lobbyCode });

    if (!result.success) {
      throw new ApiError(422, "FIND_LOBBY_DATA_INVALID");
    }
    
    const dto: FindLobbyDto = result.data;
    const lobby = await this.lobbyService.findLobby({ lobbyCode: dto.lobbyCode });
    
    return res.status(200).json(success(lobby));
  }

  /**
   * Контроллер поиска нескольких лобби
   */
  public async findLobbies(_: Request, res: Response) {
    const lobbies = await this.lobbyService.findLobbies();
    
    return res.status(200).json(success(lobbies));
  }

  /**
   * Контроллер создания лобби
   */
  public async createLobby(req: Request, res: Response) {
    const result = CreateLobbyDtoSchema.safeParse(req.body);

    if (!result.success) {
      throw new ApiError(422, "CREATE_LOBBY_DATA_INVALID");
    }
    
    const dto: CreateLobbyDto = result.data;
    const lobby = await this.lobbyService.createLobby({ ...dto });
    
    return res.status(200).json(success(lobby));
  }

  /**
   * Контроллер обновления лобби
  */
  public async updateLobby(req: Request, res: Response) {
    const result = UpdateLobbyDtoSchema.safeParse(req.body);
    if (!result.success) {
      throw new ApiError(422, "UPDATE_LOBBY_DATA_INVALID");
    }
    const dto: UpdateLobbyDto = result.data;

    const lobby = await this.lobbyService.updateLobby({...dto});
    
    return res.status(200).json(success(lobby));
  }

  /**
   * Контроллер удаления лобби
   */
  public async deleteLobby(req: Request, res: Response) {
    const result = DeleteLobbyDtoSchema.safeParse({ lobbyCode: req.params.lobbyCode });
    if (!result.success) {
      throw new ApiError(422, "DELETE_LOBBY_DATA_INVALID");
    }
    const dto: DeleteLobbyDto = result.data;

    const lobby = await this.lobbyService.deleteLobby(dto);
    
    return res.status(200).json(success(lobby));  
  }  

  /**
   * Контроллер присоединения к лобби
  */ 
  public async joinLobby(req: Request, res: Response) {
    const result = JoinLobbyDtoSchema.safeParse(req.body);

    if (!result.success) {
      throw new ApiError(422, "JOIN_LOBBY_DATA_INVALID");
    }
    
    const dto: JoinLobbyDto = result.data;
    const lobby = await this.lobbyService.joinLobby({...dto});

    return res.status(200).json(success(lobby));  
  }
  
  
}
