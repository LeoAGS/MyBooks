using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
var databasePath = Path.Combine(builder.Environment.ContentRootPath, "mybooks.db");

builder.Services.AddDbContext<BooksDbContext>(options =>
    options.UseSqlite($"Data Source={databasePath}"));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
        policy.WithOrigins("http://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod());
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<BooksDbContext>();
    await db.Database.EnsureCreatedAsync();
    await SeedData.EnsureSeededAsync(db);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("Frontend");
app.UseHttpsRedirection();

app.MapGet("/api/catalog", async (BooksDbContext db) =>
{
    var works = await LoadWorks(db).ToListAsync();
    var summaries = works.Select(ToWorkSummary).ToList();

    var readings = summaries
        .Where(work => work.Readings.Count > 0)
        .OrderBy(work => work.Title);

    var library = summaries
        .Where(work => work.Copies.Count > 0)
        .OrderBy(work => work.Title);

    return Results.Ok(new CatalogResponse(readings, library, ToStats(works)));
})
.WithName("GetCatalog")
.WithOpenApi();

app.MapGet("/api/works", async (BooksDbContext db) =>
{
    var works = await LoadWorks(db)
        .OrderBy(work => work.Title)
        .ToListAsync();

    return Results.Ok(works.Select(ToWorkSummary));
})
.WithName("GetWorks")
.WithOpenApi();

app.MapGet("/api/works/{id:guid}", async (Guid id, BooksDbContext db) =>
{
    var work = await LoadWorks(db).FirstOrDefaultAsync(item => item.Id == id);
    return work is null ? Results.NotFound() : Results.Ok(ToWorkSummary(work));
})
.WithName("GetWork")
.WithOpenApi();

app.MapPost("/api/works", async (CreateWorkRequest request, BooksDbContext db) =>
{
    if (string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Author))
    {
        return Results.BadRequest("Title and author are required.");
    }

    var now = DateTimeOffset.UtcNow;
    var work = new Work
    {
        Id = Guid.NewGuid(),
        Title = request.Title.Trim(),
        OriginalTitle = request.OriginalTitle?.Trim(),
        Author = request.Author.Trim(),
        OriginalYear = request.OriginalYear,
        Genre = request.Genre?.Trim(),
        Description = request.Description?.Trim(),
        CoverUrl = request.CoverUrl?.Trim(),
        CreatedAt = now,
        UpdatedAt = now
    };

    if (request.Reading is not null)
    {
        work.Readings.Add(CreateReading(work.Id, request.Reading));
    }

    if (request.Copy is not null)
    {
        work.Copies.Add(CreateCopy(work.Id, request.Copy));
    }

    db.Works.Add(work);
    await db.SaveChangesAsync();

    return Results.Created($"/api/works/{work.Id}", ToWorkSummary(work));
})
.WithName("CreateWork")
.WithOpenApi();

app.MapPost("/api/works/{id:guid}/readings", async (Guid id, UpsertReadingRequest request, BooksDbContext db) =>
{
    var work = await LoadWorks(db).FirstOrDefaultAsync(item => item.Id == id);
    if (work is null)
    {
        return Results.NotFound();
    }

    work.Readings.Add(CreateReading(work.Id, request));
    work.UpdatedAt = DateTimeOffset.UtcNow;
    await db.SaveChangesAsync();

    return Results.Created($"/api/works/{id}/readings/{work.Readings.Last().Id}", ToWorkSummary(work));
})
.WithName("CreateReading")
.WithOpenApi();

app.MapPut("/api/works/{id:guid}/reading", async (Guid id, UpsertReadingRequest request, BooksDbContext db) =>
{
    var work = await LoadWorks(db).FirstOrDefaultAsync(item => item.Id == id);
    if (work is null)
    {
        return Results.NotFound();
    }

    var reading = work.Readings
        .OrderByDescending(item => item.FinishedAt)
        .ThenByDescending(item => item.StartedAt)
        .FirstOrDefault();

    if (reading is null)
    {
        work.Readings.Add(CreateReading(work.Id, request));
    }
    else
    {
        UpdateReading(reading, request);
    }

    work.UpdatedAt = DateTimeOffset.UtcNow;
    await db.SaveChangesAsync();

    return Results.Ok(ToWorkSummary(work));
})
.WithName("UpsertCurrentReading")
.WithOpenApi();

app.MapPost("/api/works/{id:guid}/copies", async (Guid id, CreateCopyRequest request, BooksDbContext db) =>
{
    var work = await LoadWorks(db).FirstOrDefaultAsync(item => item.Id == id);
    if (work is null)
    {
        return Results.NotFound();
    }

    var copy = CreateCopy(work.Id, request);
    work.Copies.Add(copy);
    work.UpdatedAt = DateTimeOffset.UtcNow;
    await db.SaveChangesAsync();

    return Results.Created($"/api/works/{id}/copies/{copy.Id}", ToWorkSummary(work));
})
.WithName("CreateCopy")
.WithOpenApi();

app.MapDelete("/api/works/{id:guid}", async (Guid id, BooksDbContext db) =>
{
    var work = await LoadWorks(db).FirstOrDefaultAsync(item => item.Id == id);
    if (work is null)
    {
        return Results.NotFound();
    }

    db.Works.Remove(work);
    await db.SaveChangesAsync();

    return Results.NoContent();
})
.WithName("DeleteWork")
.WithOpenApi();

app.Run();

static IQueryable<Work> LoadWorks(BooksDbContext db) =>
    db.Works
        .Include(work => work.Readings)
        .Include(work => work.Copies);

static WorkSummary ToWorkSummary(Work work)
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

static ReadingSummary ToReadingSummary(Reading reading) =>
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

static CopySummary ToCopySummary(LibraryCopy copy) =>
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
        copy.IsLoaned,
        copy.LoanedTo,
        copy.LoanedAt,
        copy.ExpectedReturnAt,
        copy.Notes);

static CatalogStats ToStats(List<Work> works)
{
    var readCount = works.Count(work => work.Readings.Any(reading => reading.Status == ReadingStatus.Read));
    var ownedCount = works.Count(work => work.Copies.Count > 0);
    var readingNowCount = works.Count(work => work.Readings.Any(reading => reading.Status == ReadingStatus.Reading));
    var loanedCount = works.SelectMany(work => work.Copies).Count(copy => copy.IsLoaned);

    return new CatalogStats(works.Count, readCount, ownedCount, readingNowCount, loanedCount);
}

static Reading CreateReading(Guid workId, UpsertReadingRequest request)
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

static void UpdateReading(Reading reading, UpsertReadingRequest request)
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

static LibraryCopy CreateCopy(Guid workId, CreateCopyRequest request)
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
        IsLoaned = request.IsLoaned,
        LoanedTo = request.LoanedTo?.Trim(),
        LoanedAt = request.LoanedAt,
        ExpectedReturnAt = request.ExpectedReturnAt,
        Notes = request.Notes?.Trim(),
        CreatedAt = now,
        UpdatedAt = now
    };
}

class BooksDbContext(DbContextOptions<BooksDbContext> options) : DbContext(options)
{
    public DbSet<Work> Works => Set<Work>();
    public DbSet<Reading> Readings => Set<Reading>();
    public DbSet<LibraryCopy> Copies => Set<LibraryCopy>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Work>(entity =>
        {
            entity.ToTable("Works");
            entity.HasKey(work => work.Id);
            entity.Property(work => work.Title).HasMaxLength(240).IsRequired();
            entity.Property(work => work.OriginalTitle).HasMaxLength(240);
            entity.Property(work => work.Author).HasMaxLength(180).IsRequired();
            entity.Property(work => work.Genre).HasMaxLength(80);
            entity.Property(work => work.CoverUrl).HasMaxLength(500);
            entity.HasMany(work => work.Readings)
                .WithOne(reading => reading.Work)
                .HasForeignKey(reading => reading.WorkId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasMany(work => work.Copies)
                .WithOne(copy => copy.Work)
                .HasForeignKey(copy => copy.WorkId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Reading>(entity =>
        {
            entity.ToTable("Readings");
            entity.HasKey(reading => reading.Id);
            entity.Property(reading => reading.Status).HasConversion<string>().HasMaxLength(40);
            entity.Property(reading => reading.Rating);
        });

        modelBuilder.Entity<LibraryCopy>(entity =>
        {
            entity.ToTable("Copies");
            entity.HasKey(copy => copy.Id);
            entity.Property(copy => copy.Format).HasConversion<string>().HasMaxLength(40);
            entity.Property(copy => copy.AcquisitionType).HasConversion<string>().HasMaxLength(40);
            entity.Property(copy => copy.Publisher).HasMaxLength(180);
            entity.Property(copy => copy.Edition).HasMaxLength(120);
            entity.Property(copy => copy.Isbn).HasMaxLength(32);
            entity.Property(copy => copy.Language).HasMaxLength(40);
            entity.Property(copy => copy.Condition).HasMaxLength(80);
            entity.Property(copy => copy.Location).HasMaxLength(180);
            entity.Property(copy => copy.Currency).HasMaxLength(8);
            entity.Property(copy => copy.LoanedTo).HasMaxLength(180);
            entity.Property(copy => copy.PricePaid).HasPrecision(10, 2);
        });
    }
}

static class SeedData
{
    public static async Task EnsureSeededAsync(BooksDbContext db)
    {
        if (await db.Works.AnyAsync())
        {
            return;
        }

        var domCasmurroId = Guid.Parse("3a35f6c1-0a5d-4f86-9cb7-9fd5a4c8a601");
        var hobbitId = Guid.Parse("7dc01418-f330-42ab-bbd1-e01e98364451");
        var duneId = Guid.Parse("b897a56c-96f9-4c5e-9d0f-42d496bf0e5b");
        var now = DateTimeOffset.UtcNow;

        db.Works.AddRange(
            new Work
            {
                Id = domCasmurroId,
                Title = "Dom Casmurro",
                Author = "Machado de Assis",
                OriginalYear = 1899,
                Genre = "Romance",
                Description = "Uma obra lida e registrada, mesmo sem exemplar fisico cadastrado.",
                CreatedAt = now,
                UpdatedAt = now,
                Readings =
                [
                    new Reading
                    {
                        Id = Guid.NewGuid(),
                        WorkId = domCasmurroId,
                        Status = ReadingStatus.Read,
                        StartedAt = new DateOnly(2024, 2, 10),
                        FinishedAt = new DateOnly(2024, 2, 24),
                        Rating = 5,
                        Review = "Leitura excelente para revisitar narradores pouco confiaveis.",
                        Notes = "Adicionar citacoes favoritas depois.",
                        IsFavorite = true,
                        WantToReRead = true,
                        CreatedAt = now,
                        UpdatedAt = now
                    }
                ]
            },
            new Work
            {
                Id = hobbitId,
                Title = "O Hobbit",
                OriginalTitle = "The Hobbit",
                Author = "J.R.R. Tolkien",
                OriginalYear = 1937,
                Genre = "Fantasia",
                Description = "Exemplo de obra lida que tambem possui exemplar na biblioteca.",
                CreatedAt = now,
                UpdatedAt = now,
                Readings =
                [
                    new Reading
                    {
                        Id = Guid.NewGuid(),
                        WorkId = hobbitId,
                        Status = ReadingStatus.Read,
                        StartedAt = new DateOnly(2023, 7, 1),
                        FinishedAt = new DateOnly(2023, 7, 18),
                        Rating = 5,
                        Review = "Aventura confortavel e muito redonda.",
                        CreatedAt = now,
                        UpdatedAt = now
                    }
                ],
                Copies =
                [
                    new LibraryCopy
                    {
                        Id = Guid.NewGuid(),
                        WorkId = hobbitId,
                        Format = CopyFormat.Physical,
                        Publisher = "HarperCollins",
                        Edition = "Capa dura",
                        Isbn = "9788595084742",
                        PublishedYear = 2019,
                        Language = "Portugues",
                        Condition = "Muito bom",
                        Location = "Estante sala / Prateleira 2",
                        AcquisitionDate = new DateOnly(2021, 12, 5),
                        AcquisitionType = AcquisitionType.Bought,
                        PricePaid = 49.90m,
                        Currency = "BRL",
                        CreatedAt = now,
                        UpdatedAt = now
                    }
                ]
            },
            new Work
            {
                Id = duneId,
                Title = "Duna",
                OriginalTitle = "Dune",
                Author = "Frank Herbert",
                OriginalYear = 1965,
                Genre = "Ficcao cientifica",
                Description = "Exemplo de livro presente na biblioteca, mas ainda nao finalizado.",
                CreatedAt = now,
                UpdatedAt = now,
                Readings =
                [
                    new Reading
                    {
                        Id = Guid.NewGuid(),
                        WorkId = duneId,
                        Status = ReadingStatus.WantToRead,
                        Notes = "Comecar depois de terminar a leitura atual.",
                        CreatedAt = now,
                        UpdatedAt = now
                    }
                ],
                Copies =
                [
                    new LibraryCopy
                    {
                        Id = Guid.NewGuid(),
                        WorkId = duneId,
                        Format = CopyFormat.Physical,
                        Publisher = "Aleph",
                        Edition = "Edicao especial",
                        Isbn = "9788576573135",
                        PublishedYear = 2017,
                        Language = "Portugues",
                        Condition = "Bom",
                        Location = "Estante quarto / Prateleira 1",
                        AcquisitionDate = new DateOnly(2022, 8, 14),
                        AcquisitionType = AcquisitionType.Bought,
                        PricePaid = 69.90m,
                        Currency = "BRL",
                        CreatedAt = now,
                        UpdatedAt = now
                    }
                ]
            });

        await db.SaveChangesAsync();
    }
}

class Work
{
    public Guid Id { get; set; }
    public string Title { get; set; } = "";
    public string? OriginalTitle { get; set; }
    public string Author { get; set; } = "";
    public int? OriginalYear { get; set; }
    public string? Genre { get; set; }
    public string? Description { get; set; }
    public string? CoverUrl { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public List<Reading> Readings { get; set; } = [];
    public List<LibraryCopy> Copies { get; set; } = [];
}

class Reading
{
    public Guid Id { get; set; }
    public Guid WorkId { get; set; }
    public Work? Work { get; set; }
    public ReadingStatus Status { get; set; }
    public DateOnly? StartedAt { get; set; }
    public DateOnly? FinishedAt { get; set; }
    public int? Rating { get; set; }
    public string? Review { get; set; }
    public string? Notes { get; set; }
    public bool IsFavorite { get; set; }
    public bool WantToReRead { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

class LibraryCopy
{
    public Guid Id { get; set; }
    public Guid WorkId { get; set; }
    public Work? Work { get; set; }
    public CopyFormat Format { get; set; }
    public string? Publisher { get; set; }
    public string? Edition { get; set; }
    public string? Isbn { get; set; }
    public int? PublishedYear { get; set; }
    public string? Language { get; set; }
    public int? PageCount { get; set; }
    public string? Condition { get; set; }
    public string? Location { get; set; }
    public DateOnly? AcquisitionDate { get; set; }
    public AcquisitionType AcquisitionType { get; set; }
    public decimal? PricePaid { get; set; }
    public string Currency { get; set; } = "BRL";
    public bool IsGift { get; set; }
    public bool IsSigned { get; set; }
    public bool IsLoaned { get; set; }
    public string? LoanedTo { get; set; }
    public DateOnly? LoanedAt { get; set; }
    public DateOnly? ExpectedReturnAt { get; set; }
    public string? Notes { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

record WorkSummary(
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

record ReadingSummary(
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

record CopySummary(
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
    bool IsLoaned,
    string? LoanedTo,
    DateOnly? LoanedAt,
    DateOnly? ExpectedReturnAt,
    string? Notes);

record CatalogResponse(
    IEnumerable<WorkSummary> Readings,
    IEnumerable<WorkSummary> Library,
    CatalogStats Stats);

record CatalogStats(
    int TotalWorks,
    int ReadWorks,
    int OwnedWorks,
    int ReadingNow,
    int LoanedCopies);

record CreateWorkRequest(
    string Title,
    string Author,
    string? OriginalTitle,
    int? OriginalYear,
    string? Genre,
    string? Description,
    string? CoverUrl,
    UpsertReadingRequest? Reading,
    CreateCopyRequest? Copy);

record UpsertReadingRequest(
    ReadingStatus Status,
    DateOnly? StartedAt,
    DateOnly? FinishedAt,
    int? Rating,
    string? Review,
    string? Notes,
    bool IsFavorite,
    bool WantToReRead);

record CreateCopyRequest(
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
    string? Currency,
    bool IsGift,
    bool IsSigned,
    bool IsLoaned,
    string? LoanedTo,
    DateOnly? LoanedAt,
    DateOnly? ExpectedReturnAt,
    string? Notes);

enum ReadingStatus
{
    WantToRead,
    Reading,
    Read,
    Abandoned,
    Paused
}

enum CopyFormat
{
    Physical,
    Ebook,
    Audiobook
}

enum AcquisitionType
{
    Bought,
    Gift,
    Borrowed,
    Inherited,
    Download,
    Unknown
}
