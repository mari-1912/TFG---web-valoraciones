import SectionBooks from "../products/books-section";
import SectionVideoGames from "../products/video-games-section";
import SectionMovies from "../products/movies-section";
import SectionSeries from "../products/series-section";
import SectionBoardGames from "../products/board-games-section";
import SectionMusic from "../products/music-section";
import { CircleStar, Search, Users } from "lucide-react";

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
