/**
 * DTO для findDeck
 * @param id айди колоды
 */
export class FindDeckDto { 
    id: string;

    constructor(id: string) { 
        this.id = id;
    }
}