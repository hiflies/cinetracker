-- Run once on databases created before lists existed (keeps movie ids == old ranks,
-- so existing "watched" rows stay valid). Fresh databases do not need this.
ALTER TABLE movie CHANGE `rank` id INT NOT NULL AUTO_INCREMENT;
ALTER TABLE watched CHANGE movieRank movieId INT NOT NULL;
