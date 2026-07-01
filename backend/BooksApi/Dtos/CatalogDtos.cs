public record WorkSummary(
    Guid Id,
    string Title,
    string? OriginalTitle,
    string Author,
    int? OriginalYear,
    string? Genre,
    string? Description,
    string? CoverUrl,
    ReadingSummary? Reading,
    IReadOnlyCollection<ReadingSummary> Readings,
    IReadOnlyCollection<CopySummary> Copies,
    int CopyCount,
    DateTimeOffset UpdatedAt);

public record ReadingSummary(
    Guid Id,
    ReadingStatus Status,
    DateOnly? StartedAt,
    DateOnly? FinishedAt,
    int? Rating,
    string? Review,
    string? Notes,
    bool IsFavorite,
    bool WantToReRead,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public record CopySummary(
    Guid Id,
    CopyFormat Format,
    string? Publisher,
    string? Edition,
    string? Isbn,
    int? PublishedYear,
    string? Language,
    int? PageCount,
    string? Condition,
    string? Location,
    DateOnly? AcquisitionDate,
    AcquisitionType AcquisitionType,
    decimal? PricePaid,
    string Currency,
    bool IsGift,
    bool IsSigned,
    string? Notes);

public record CatalogResponse(
    IEnumerable<WorkSummary> Readings,
    IEnumerable<WorkSummary> Library,
    CatalogStats Stats);

public record CatalogStats(
    int TotalWorks,
    int ReadWorks,
    int OwnedWorks,
    int ReadingNow);
