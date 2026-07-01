using Microsoft.EntityFrameworkCore;

public static class WorkEndpoints
{
    public static IEndpointRouteBuilder MapWorkEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/works", async (BooksDbContext db) =>
        {
            var works = await CatalogQueries.LoadWorks(db)
                .OrderBy(work => work.Title)
                .ToListAsync();

            return Results.Ok(works.Select(CatalogMapper.ToWorkSummary));
        })
        .WithName("GetWorks")
        .WithOpenApi();

        app.MapGet("/api/works/{id:guid}", async (Guid id, BooksDbContext db) =>
        {
            var work = await CatalogQueries.LoadWorks(db).FirstOrDefaultAsync(item => item.Id == id);
            return work is null ? Results.NotFound() : Results.Ok(CatalogMapper.ToWorkSummary(work));
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
                work.Readings.Add(CatalogMutations.CreateReading(work.Id, request.Reading));
            }

            if (request.Copy is not null)
            {
                work.Copies.Add(CatalogMutations.CreateCopy(work.Id, request.Copy));
            }

            db.Works.Add(work);
            await db.SaveChangesAsync();

            return Results.Created($"/api/works/{work.Id}", CatalogMapper.ToWorkSummary(work));
        })
        .WithName("CreateWork")
        .WithOpenApi();

        app.MapPut("/api/works/{id:guid}", async (Guid id, UpdateWorkRequest request, BooksDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Author))
            {
                return Results.BadRequest("Title and author are required.");
            }

            var work = await CatalogQueries.LoadWorks(db).FirstOrDefaultAsync(item => item.Id == id);
            if (work is null)
            {
                return Results.NotFound();
            }

            CatalogMutations.UpdateWork(work, request);
            await db.SaveChangesAsync();

            return Results.Ok(CatalogMapper.ToWorkSummary(work));
        })
        .WithName("UpdateWork")
        .WithOpenApi();

        app.MapDelete("/api/works/{id:guid}", async (Guid id, BooksDbContext db) =>
        {
            var work = await CatalogQueries.LoadWorks(db).FirstOrDefaultAsync(item => item.Id == id);
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

        return app;
    }
}
