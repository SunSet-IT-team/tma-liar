import type { Request, Response } from 'express';
import { LobbyService } from './lobby.service';
import { ApiError, success } from '../common/response';
import { asyncHandler } from '../middlewares/asyncHandler.middleware';
import { 
  findLobbiesCodesValidator, 
  findLobbyCodeValidator, 
  createLobbyValidator, 
  updateLobbyValidator, 
  deleteLobbyCodeValidator,
  joinLobbyValidator,
} from './lobby.validators'; 
import { 
  CreateLobbyDto, 
  FindLobbiesDto, 
  FindLobbyDto, 
  DeleteLobbyDto,
  JoinLobbyDto, 
  ToggleReadyDto, 
  UpdateLobbyDto
} from './lobby.dtos';

const lobbyService = new LobbyService();

/**
 * Класс контроллеров лобби
 */
export class LobbyController { 
  /**
   * Контроллер получения одного лобби
   */
  public async findLobby(req: Request, res: Response) {
    const dto = new FindLobbyDto(findLobbyCodeValidator(req.params.id).lobbyCode);

    const lobby = await lobbyService.findLobby({ lobbyCode: dto.lobbyCode });
    
    return res.status(200).json(success(lobby));
  }

  /**
   * Контроллер поиска нескольких лобби
   */
  public async findLobbies(req: Request, res: Response) {
    const dto = new FindLobbiesDto(findLobbiesCodesValidator(req.body.lobbyCodes).lobbyCodes);

    const lobbies = await lobbyService.findLobbies({ lobbyCodes: dto.lobbyCodes });
    
    return res.status(200).json(success(lobbies));
  }

  /**
   * Контроллер создания лобби
   */
  public async createLobby(req: Request, res: Response) {
    const dto: CreateLobbyDto = new CreateLobbyDto(createLobbyValidator(req.body));

    const lobby = await lobbyService.createLobby({ ...dto });
    
    return res.status(200).json(success(lobby));
  }

  /**
   * Контроллер обновления лобби
   */
  public async updateLobby(req: Request, res: Response) {
    const dto: UpdateLobbyDto = new UpdateLobbyDto(updateLobbyValidator(req.body));

    const lobby = await lobbyService.updateLobby({...dto});
    
    return res.status(200).json(success(lobby));
  }

  /**
   * Контроллер удаления лобби
   */
  public async deleteLobby(req: Request, res: Response) {
    const dto = new DeleteLobbyDto(deleteLobbyCodeValidator(req.params.id).lobbyCode);

    const lobby = await lobbyService.deleteLobby({ lobbyCode: dto.lobbyCode });
    
    return res.status(200).json(success(lobby));  
  }  

  /**
   * Контроллер присоединения к лобби
   */
  public async joinLobby(req: Request, res: Response) {
    const dto: JoinLobbyDto = new JoinLobbyDto(joinLobbyValidator(req.body));

    const lobby = await lobbyService.joinLobby({...dto});

    return res.status(200).json(success(lobby));  
  }  
}