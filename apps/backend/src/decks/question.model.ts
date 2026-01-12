import { Schema, model } from 'mongoose';
import type { Question } from './entities/question.entity';

/**
 * Модель сущности "Вопрсос"
 */
export const QuestionSchema = new Schema<Question>(
    {
        id: { 
            type: String, 
            required: true
        },  

        type: { 
            type: String, 
            required: true
        }, 

        content: { 
            type: String, 
            required: true
        }, 

        complexity: { 
            type: Number, 
            required: true
        }, 
    }
);

export const QuestionModel = model<Question>('Question', QuestionSchema);
