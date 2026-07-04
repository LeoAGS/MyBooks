public record CreateWorkRequest(
    string Title,
    string Author,
    string? OriginalTitle,
    int? OriginalYear,
    string? Genre,
    string? Category,
    string? CollectionName,
    string? CollectionNumber,
    string? Description,
    string? CoverUrl,
    UpsertReadingRequest? Reading,
    CreateCopyRequest? Copy);

public record UpdateWorkRequest(
    string Title,
    string Author,
    string? OriginalTitle,
    int? OriginalYear,
    string? Genre,
    string? Category,
    string? CollectionName,
    string? CollectionNumber,
    string? Description,
    string? CoverUrl);
