using Microsoft.EntityFrameworkCore;

public static class CopyEndpoints
{
    public static IEndpointRouteBuilder MapCopyEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/works/{id:guid}/copies", async (Guid id, CreateCopyRequest request, BooksDbContext db) =>
        {
            var work = await CatalogQueries.LoadWorks(db).FirstOrDefaultAsync(item => item.Id == id);
            if (work is null)
            {
                return Results.NotFound();
            }

            var copy = CatalogMutations.CreateCopy(work.Id, request);
            db.Copies.Add(copy);
            work.UpdatedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync();

            work = await CatalogQueries.LoadWorks(db).FirstAsync(item => item.Id == id);
            return Results.Created($"/api/works/{id}/copies/{copy.Id}", CatalogMapper.ToWorkSummary(work));
        })
        .WithName("CreateCopy")
        .WithOpenApi();

        app.MapPut("/api/works/{workId:guid}/copies/{copyId:guid}", async (
            Guid workId,
            Guid copyId,
            CreateCopyRequest request,
            BooksDbContext db) =>
        {
            var work = await CatalogQueries.LoadWorks(db).FirstOrDefaultAsync(item => item.Id == workId);
            if (work is null)
            {
                return Results.NotFound();
            }

            var copy = work.Copies.FirstOrDefault(item => item.Id == copyId);
            if (copy is null)
            {
                return Results.NotFound();
            }

            CatalogMutations.UpdateCopy(copy, request);
            work.UpdatedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync();

            return Results.Ok(CatalogMapper.ToWorkSummary(work));
        })
        .WithName("UpdateCopy")
        .WithOpenApi();

        app.MapDelete("/api/works/{workId:guid}/copies/{copyId:guid}", async (
            Guid workId,
            Guid copyId,
            BooksDbContext db) =>
        {
            var work = await CatalogQueries.LoadWorks(db).FirstOrDefaultAsync(item => item.Id == workId);
            if (work is null)
            {
                return Results.NotFound();
            }

            var copy = work.Copies.FirstOrDefault(item => item.Id == copyId);
            if (copy is null)
            {
                return Results.NotFound();
            }

            db.Copies.Remove(copy);
            work.UpdatedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync();

            return Results.NoContent();
        })
        .WithName("DeleteCopy")
        .WithOpenApi();

        return app;
    }
}
