/**
 * DTO для deleteDeck
 * @param id айди колоды
 */
export class DeleteDeckDto { 
    id: string;

    constructor(id: string) { 
        this.id = id;
    }
}