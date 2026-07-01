using Microsoft.EntityFrameworkCore;

public static class ReadingEndpoints
{
    public static IEndpointRouteBuilder MapReadingEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/works/{id:guid}/readings", async (Guid id, UpsertReadingRequest request, BooksDbContext db) =>
        {
            var work = await CatalogQueries.LoadWorks(db).FirstOrDefaultAsync(item => item.Id == id);
            if (work is null)
            {
                return Results.NotFound();
            }

            var reading = CatalogMutations.CreateReading(work.Id, request);
            db.Readings.Add(reading);
            work.UpdatedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync();

            work = await CatalogQueries.LoadWorks(db).FirstAsync(item => item.Id == id);
            return Results.Created($"/api/works/{id}/readings/{reading.Id}", CatalogMapper.ToWorkSummary(work));
        })
        .WithName("CreateReading")
        .WithOpenApi();

        app.MapPut("/api/works/{id:guid}/reading", async (Guid id, UpsertReadingRequest request, BooksDbContext db) =>
        {
            var work = await CatalogQueries.LoadWorks(db).FirstOrDefaultAsync(item => item.Id == id);
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
                work.Readings.Add(CatalogMutations.CreateReading(work.Id, request));
            }
            else
            {
                CatalogMutations.UpdateReading(reading, request);
            }

            work.UpdatedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync();

            return Results.Ok(CatalogMapper.ToWorkSummary(work));
        })
        .WithName("UpsertCurrentReading")
        .WithOpenApi();

        app.MapPut("/api/works/{workId:guid}/readings/{readingId:guid}", async (
            Guid workId,
            Guid readingId,
            UpsertReadingRequest request,
            BooksDbContext db) =>
        {
            var work = await CatalogQueries.LoadWorks(db).FirstOrDefaultAsync(item => item.Id == workId);
            if (work is null)
            {
                return Results.NotFound();
            }

            var reading = work.Readings.FirstOrDefault(item => item.Id == readingId);
            if (reading is null)
            {
                return Results.NotFound();
            }

            CatalogMutations.UpdateReading(reading, request);
            work.UpdatedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync();

            return Results.Ok(CatalogMapper.ToWorkSummary(work));
        })
        .WithName("UpdateReading")
        .WithOpenApi();

        app.MapDelete("/api/works/{workId:guid}/readings/{readingId:guid}", async (
            Guid workId,
            Guid readingId,
            BooksDbContext db) =>
        {
            var work = await CatalogQueries.LoadWorks(db).FirstOrDefaultAsync(item => item.Id == workId);
            if (work is null)
            {
                return Results.NotFound();
            }

            var reading = work.Readings.FirstOrDefault(item => item.Id == readingId);
            if (reading is null)
            {
                return Results.NotFound();
            }

            db.Readings.Remove(reading);
            work.UpdatedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync();

            return Results.NoContent();
        })
        .WithName("DeleteReading")
        .WithOpenApi();

        return app;
    }
}
