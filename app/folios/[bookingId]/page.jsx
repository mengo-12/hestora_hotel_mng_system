import FolioPage from "./FolioPage";

export default function Page({ params }) {
    const { bookingId } = params;
    return <FolioPage bookingId={bookingId} />;
}
