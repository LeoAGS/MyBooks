using Microsoft.EntityFrameworkCore;

public static class CatalogEndpoints
{
    public static IEndpointRouteBuilder MapCatalogEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/catalog", async (BooksDbContext db) =>
        {
            var works = await CatalogQueries.LoadWorks(db).ToListAsync();
            var summaries = works.Select(CatalogMapper.ToWorkSummary).ToList();

            var readings = summaries
                .Where(work => work.Readings.Count > 0)
                .OrderBy(work => work.Title);

            var library = summaries
                .Where(work => work.Copies.Count > 0)
                .OrderBy(work => work.Title);

            return Results.Ok(new CatalogResponse(readings, library, CatalogMapper.ToStats(works)));
        })
        .WithName("GetCatalog")
        .WithOpenApi();

        return app;
    }
}
