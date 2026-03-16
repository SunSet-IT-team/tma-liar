import { PageHeader } from '../../components/PageHeader';
import { DeckEditor } from './DeckEditor';

export function DecksPage() {
  return (
    <div>
      <PageHeader title="Редактор колод" />
      <DeckEditor />
    </div>
  );
}
