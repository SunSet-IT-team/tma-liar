export type DeckQuestion = {
  id: string;
  type: string;
  content: string;
  complexity: number;
};

export type Deck = {
  id: string;
  name: string;
  description?: string;
  ageLimit?: number;
  categories?: string[];
  questionsCount: number;
  cover: string;
  isPaid?: boolean;
  priceRub?: number;
  isPurchased?: boolean;
  isLocked?: boolean;
  questions: DeckQuestion[];
};

export type DeckPurchaseCreateResponse = {
  paymentId: string;
  confirmationUrl: string;
  alreadyPurchased: boolean;
};

export type DeckPurchaseConfirmResponse = {
  purchased: boolean;
};
