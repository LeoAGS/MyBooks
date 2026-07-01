public static class CatalogMutations
{
    public static Reading CreateReading(Guid workId, UpsertReadingRequest request)
    {
        var now = DateTimeOffset.UtcNow;

        return new Reading
        {
            Id = Guid.NewGuid(),
            WorkId = workId,
            Status = request.Status,
            StartedAt = request.StartedAt,
            FinishedAt = request.FinishedAt,
            Rating = request.Rating,
            Review = request.Review?.Trim(),
            Notes = request.Notes?.Trim(),
            IsFavorite = request.IsFavorite,
            WantToReRead = request.WantToReRead,
            CreatedAt = now,
            UpdatedAt = now
        };
    }

    public static LibraryCopy CreateCopy(Guid workId, CreateCopyRequest request)
    {
        var now = DateTimeOffset.UtcNow;

        return new LibraryCopy
        {
            Id = Guid.NewGuid(),
            WorkId = workId,
            Format = request.Format,
            Publisher = request.Publisher?.Trim(),
            Edition = request.Edition?.Trim(),
            Isbn = request.Isbn?.Trim(),
            PublishedYear = request.PublishedYear,
            Language = request.Language?.Trim(),
            PageCount = request.PageCount,
            Condition = request.Condition?.Trim(),
            Location = request.Location?.Trim(),
            AcquisitionDate = request.AcquisitionDate,
            AcquisitionType = request.AcquisitionType,
            PricePaid = request.PricePaid,
            Currency = request.Currency?.Trim() ?? "BRL",
            IsGift = request.IsGift,
            IsSigned = request.IsSigned,
            Notes = request.Notes?.Trim(),
            CreatedAt = now,
            UpdatedAt = now
        };
    }

    public static void UpdateWork(Work work, UpdateWorkRequest request)
    {
        work.Title = request.Title.Trim();
        work.OriginalTitle = request.OriginalTitle?.Trim();
        work.Author = request.Author.Trim();
        work.OriginalYear = request.OriginalYear;
        work.Genre = request.Genre?.Trim();
        work.Description = request.Description?.Trim();
        work.CoverUrl = request.CoverUrl?.Trim();
        work.UpdatedAt = DateTimeOffset.UtcNow;
    }

    public static void UpdateReading(Reading reading, UpsertReadingRequest request)
    {
        reading.Status = request.Status;
        reading.StartedAt = request.StartedAt;
        reading.FinishedAt = request.FinishedAt;
        reading.Rating = request.Rating;
        reading.Review = request.Review?.Trim();
        reading.Notes = request.Notes?.Trim();
        reading.IsFavorite = request.IsFavorite;
        reading.WantToReRead = request.WantToReRead;
        reading.UpdatedAt = DateTimeOffset.UtcNow;
    }

    public static void UpdateCopy(LibraryCopy copy, CreateCopyRequest request)
    {
        copy.Format = request.Format;
        copy.Publisher = request.Publisher?.Trim();
        copy.Edition = request.Edition?.Trim();
        copy.Isbn = request.Isbn?.Trim();
        copy.PublishedYear = request.PublishedYear;
        copy.Language = request.Language?.Trim();
        copy.PageCount = request.PageCount;
        copy.Condition = request.Condition?.Trim();
        copy.Location = request.Location?.Trim();
        copy.AcquisitionDate = request.AcquisitionDate;
        copy.AcquisitionType = request.AcquisitionType;
        copy.PricePaid = request.PricePaid;
        copy.Currency = request.Currency?.Trim() ?? "BRL";
        copy.IsGift = request.IsGift;
        copy.IsSigned = request.IsSigned;
        copy.Notes = request.Notes?.Trim();
        copy.UpdatedAt = DateTimeOffset.UtcNow;
    }
}
