import SectionBooks from "../products/books-section";
import SectionVideoGames from "../products/video-games-section";
import SectionMovies from "../products/movies-section";
import SectionSeries from "../products/series-section";

export function ServicesList() {
  return (
    <section className="flex flex-col justify-center">
      <SectionMovies />
      <SectionSeries />
      <SectionBooks />
      <SectionVideoGames />
    </section>
  );
}
