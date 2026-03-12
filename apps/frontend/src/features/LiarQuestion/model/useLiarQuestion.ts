import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageRoutes } from '@app/routes/pages';
import { getCurrentTmaUser } from '@shared/lib/tma/user';
import { lobbySessionService } from '@shared/services/lobby/lobby-session.service';

export function useLiarQuestion() {
  const navigate = useNavigate();
  const user = useMemo(() => getCurrentTmaUser(), []);
  const session = lobbySessionService.get();
  const questionText = session?.currentQuestionText ?? 'Ожидаем вопрос...';
  const isLiar = session?.currentLiarId === user.telegramId;

  useEffect(() => {
    if (!session?.currentStage) return;

    if (session.currentStage === 'liar_chooses') {
      navigate(`/${isLiar ? PageRoutes.CHOOSING_LIAR : PageRoutes.WAITING_PLAYERS}`, { replace: true });
      return;
    }

    if (!isLiar && session.currentStage === 'question_to_liar') {
      navigate(`/${PageRoutes.ANSWER_SOLVED}`, { replace: true });
    }
  }, [isLiar, navigate, session?.currentStage]);

  return {
    questionText,
  };
}

