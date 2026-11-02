export type Movie = {
  id: number;
  position: number;
  name: string;
  duration: string;
  rating: number;
  image: string;
  year: number;
};

export type MovieList = {
  id: number;
  name: string;
  system: boolean;
  movieCount: number;
};
