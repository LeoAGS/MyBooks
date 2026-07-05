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
        var copies = GetCopiesForWork(work)
            .OrderBy(copy => copy.Format)
            .ThenBy(copy => copy.Location)
            .ThenBy(copy => copy.CopyTitle)
            .Select(ToCopySummary)
            .ToList();

        return new WorkSummary(
            work.Id,
            work.Title,
            work.OriginalTitle,
            work.Author,
            work.OriginalYear,
            work.Genre,
            work.Category,
            work.CollectionName,
            work.CollectionNumber,
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
        var ownedWorksCount = works.Count(work => GetCopiesForWork(work).Any());
        var primaryCopies = works.SelectMany(work => work.Copies).DistinctBy(copy => copy.Id).ToList();
        var ownedCopiesCount = primaryCopies.Count;
        var ownedVolumesCount = primaryCopies.Sum(copy => Math.Max(1, copy.VolumeCount));
        var readingNowCount = works.Count(work => work.Readings.Any(reading => reading.Status == ReadingStatus.Reading));

        return new CatalogStats(works.Count, readCount, ownedWorksCount, ownedCopiesCount, ownedVolumesCount, readingNowCount);
    }

    private static IEnumerable<LibraryCopy> GetCopiesForWork(Work work)
    {
        var copies = work.Copies.AsEnumerable();
        var containedCopies = work.ContainedInCopies
            .Select(link => link.Copy)
            .Where(copy => copy is not null)
            .Select(copy => copy!);

        return copies.Concat(containedCopies).DistinctBy(copy => copy.Id);
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

    private static CopySummary ToCopySummary(LibraryCopy copy)
    {
        var primaryWork = copy.ContainedWorks
            .FirstOrDefault(link => link.WorkId == copy.WorkId)
            ?.Work;

        return new(
            copy.Id,
            copy.WorkId,
            primaryWork?.Title ?? "Obra principal",
            copy.CopyTitle,
            copy.Format,
            copy.Publisher,
            copy.EditorialCollection,
            copy.Edition,
            copy.Isbn,
            copy.PublishedYear,
            copy.Language,
            copy.PageCount,
            copy.VolumeCount,
            copy.Condition,
            copy.Location,
            copy.AcquisitionDate,
            copy.AcquisitionType,
            copy.PricePaid,
            copy.Currency,
            copy.IsGift,
            copy.IsSigned,
            copy.Notes,
            copy.ContainedWorks
                .OrderBy(link => link.SortOrder)
                .ThenBy(link => link.Work!.Title)
                .Where(link => link.Work is not null)
                .Select(link => new WorkReferenceSummary(link.Work!.Id, link.Work.Title, link.Work.Author))
                .ToList());
    }
}
