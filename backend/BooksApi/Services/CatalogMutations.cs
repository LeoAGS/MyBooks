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

        var copy = new LibraryCopy
        {
            Id = Guid.NewGuid(),
            WorkId = workId,
            CopyTitle = request.CopyTitle?.Trim(),
            Format = request.Format,
            Publisher = request.Publisher?.Trim(),
            EditorialCollection = request.EditorialCollection?.Trim(),
            Edition = request.Edition?.Trim(),
            Isbn = request.Isbn?.Trim(),
            PublishedYear = request.PublishedYear,
            Language = request.Language?.Trim(),
            PageCount = request.PageCount,
            VolumeCount = NormalizeVolumeCount(request.VolumeCount),
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

        SyncContainedWorks(copy, workId, request.ContainedWorkIds);
        return copy;
    }

    public static void UpdateWork(Work work, UpdateWorkRequest request)
    {
        work.Title = request.Title.Trim();
        work.OriginalTitle = request.OriginalTitle?.Trim();
        work.Author = request.Author.Trim();
        work.OriginalYear = request.OriginalYear;
        work.Genre = request.Genre?.Trim();
        work.Category = request.Category?.Trim();
        work.CollectionName = request.CollectionName?.Trim();
        work.CollectionNumber = request.CollectionNumber?.Trim();
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
        copy.CopyTitle = request.CopyTitle?.Trim();
        copy.Format = request.Format;
        copy.Publisher = request.Publisher?.Trim();
        copy.EditorialCollection = request.EditorialCollection?.Trim();
        copy.Edition = request.Edition?.Trim();
        copy.Isbn = request.Isbn?.Trim();
        copy.PublishedYear = request.PublishedYear;
        copy.Language = request.Language?.Trim();
        copy.PageCount = request.PageCount;
        copy.VolumeCount = NormalizeVolumeCount(request.VolumeCount);
        copy.Condition = request.Condition?.Trim();
        copy.Location = request.Location?.Trim();
        copy.AcquisitionDate = request.AcquisitionDate;
        copy.AcquisitionType = request.AcquisitionType;
        copy.PricePaid = request.PricePaid;
        copy.Currency = request.Currency?.Trim() ?? "BRL";
        copy.IsGift = request.IsGift;
        copy.IsSigned = request.IsSigned;
        copy.Notes = request.Notes?.Trim();
        SyncContainedWorks(copy, copy.WorkId, request.ContainedWorkIds);
        copy.UpdatedAt = DateTimeOffset.UtcNow;
    }

    private static void SyncContainedWorks(LibraryCopy copy, Guid primaryWorkId, IReadOnlyCollection<Guid>? containedWorkIds)
    {
        var orderedWorkIds = new List<Guid> { primaryWorkId };
        if (containedWorkIds is not null)
        {
            orderedWorkIds.AddRange(containedWorkIds.Where(workId => workId != Guid.Empty));
        }

        var normalizedWorkIds = orderedWorkIds.Distinct().ToList();
        copy.ContainedWorks.RemoveAll(link => !normalizedWorkIds.Contains(link.WorkId));

        for (var index = 0; index < normalizedWorkIds.Count; index += 1)
        {
            var workId = normalizedWorkIds[index];
            var existing = copy.ContainedWorks.FirstOrDefault(link => link.WorkId == workId);
            if (existing is null)
            {
                copy.ContainedWorks.Add(new CopyWork
                {
                    CopyId = copy.Id,
                    WorkId = workId,
                    SortOrder = index
                });
            }
            else
            {
                existing.SortOrder = index;
            }
        }
    }

    private static int NormalizeVolumeCount(int? volumeCount) => Math.Max(1, volumeCount.GetValueOrDefault(1));
}
