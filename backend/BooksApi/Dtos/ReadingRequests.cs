public record UpsertReadingRequest(
    ReadingStatus Status,
    DateOnly? StartedAt,
    DateOnly? FinishedAt,
    int? Rating,
    string? Review,
    string? Notes,
    bool IsFavorite,
    bool WantToReRead);
