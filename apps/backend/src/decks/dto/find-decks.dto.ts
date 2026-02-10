/**
 * DTO для findDecks
 * @param ids айди колод
 */
export class FindDecksDto { 
    ids: string[];

    constructor(ids: string[]) { 
        this.ids = ids;
    }
}