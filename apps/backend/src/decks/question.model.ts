import { Schema, model } from 'mongoose';
import type { Question } from './entities/question.entity';

/**
 * Модель сущности "Вопрос"
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
    },
    {
        _id: false,
    }
);

export const QuestionModel = model<Question>('Question', QuestionSchema);
