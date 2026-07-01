public static class CatalogMapper
{
    public static WorkSummary ToWorkSummary(Work work)
    {
        var readings = work.Readings
            .OrderByDescending(reading => reading.FinishedAt)
            .ThenByDescending(reading => reading.StartedAt)
            .ThenByDescending(reading => reading.CreatedAt)
            .Select(ToReadingSummary)
            .ToList();

        var currentReading = readings.FirstOrDefault();
        var copies = work.Copies
            .OrderBy(copy => copy.Format)
            .ThenBy(copy => copy.Location)
            .Select(ToCopySummary)
            .ToList();

        return new WorkSummary(
            work.Id,
            work.Title,
            work.OriginalTitle,
            work.Author,
            work.OriginalYear,
            work.Genre,
            work.Description,
            work.CoverUrl,
            currentReading,
            readings,
            copies,
            copies.Count,
            work.UpdatedAt);
    }

    public static CatalogStats ToStats(List<Work> works)
    {
        var readCount = works.Count(work => work.Readings.Any(reading => reading.Status == ReadingStatus.Read));
        var ownedCount = works.Count(work => work.Copies.Count > 0);
        var readingNowCount = works.Count(work => work.Readings.Any(reading => reading.Status == ReadingStatus.Reading));

        return new CatalogStats(works.Count, readCount, ownedCount, readingNowCount);
    }

    private static ReadingSummary ToReadingSummary(Reading reading) =>
        new(
            reading.Id,
            reading.Status,
            reading.StartedAt,
            reading.FinishedAt,
            reading.Rating,
            reading.Review,
            reading.Notes,
            reading.IsFavorite,
            reading.WantToReRead,
            reading.CreatedAt,
            reading.UpdatedAt);

    private static CopySummary ToCopySummary(LibraryCopy copy) =>
        new(
            copy.Id,
            copy.Format,
            copy.Publisher,
            copy.Edition,
            copy.Isbn,
            copy.PublishedYear,
            copy.Language,
            copy.PageCount,
            copy.Condition,
            copy.Location,
            copy.AcquisitionDate,
            copy.AcquisitionType,
            copy.PricePaid,
            copy.Currency,
            copy.IsGift,
            copy.IsSigned,
            copy.Notes);
}
