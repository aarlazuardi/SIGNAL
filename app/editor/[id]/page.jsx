import JournalEditor from "../../../components/journal-editor";

export default function EditJournalPage({ params }) {
  return <JournalEditor id={params.id} />;
}
