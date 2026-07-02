using System.Globalization;
using System.Text;
using Microsoft.EntityFrameworkCore;

public static class CopyEndpoints
{
    public static IEndpointRouteBuilder MapCopyEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/backups/copies.csv", async (BooksDbContext db) =>
        {
            var works = await CatalogQueries.LoadWorks(db)
                .AsNoTracking()
                .OrderBy(work => work.Title)
                .ThenBy(work => work.Author)
                .ToListAsync();

            var csv = new StringBuilder();
            AppendCsvRow(csv, [
                "obra_id",
                "exemplar_id",
                "titulo",
                "autor",
                "genero",
                "ano_original",
                "formato",
                "editora",
                "edicao",
                "isbn",
                "ano_edicao",
                "idioma",
                "paginas",
                "estado",
                "localizacao",
                "data_aquisicao",
                "tipo_aquisicao",
                "preco_pago",
                "moeda",
                "presente",
                "autografado",
                "observacoes",
                "criado_em",
                "atualizado_em"
            ]);

            foreach (var work in works)
            {
                foreach (var copy in work.Copies.OrderBy(copy => copy.Format).ThenBy(copy => copy.Location))
                {
                    AppendCsvRow(csv, [
                        work.Id.ToString(),
                        copy.Id.ToString(),
                        work.Title,
                        work.Author,
                        work.Genre,
                        work.OriginalYear?.ToString(CultureInfo.InvariantCulture),
                        copy.Format.ToString(),
                        copy.Publisher,
                        copy.Edition,
                        copy.Isbn,
                        copy.PublishedYear?.ToString(CultureInfo.InvariantCulture),
                        copy.Language,
                        copy.PageCount?.ToString(CultureInfo.InvariantCulture),
                        copy.Condition,
                        copy.Location,
                        copy.AcquisitionDate?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                        copy.AcquisitionType.ToString(),
                        copy.PricePaid?.ToString(CultureInfo.InvariantCulture),
                        copy.Currency,
                        copy.IsGift ? "sim" : "nao",
                        copy.IsSigned ? "sim" : "nao",
                        copy.Notes,
                        copy.CreatedAt.ToString("O", CultureInfo.InvariantCulture),
                        copy.UpdatedAt.ToString("O", CultureInfo.InvariantCulture)
                    ]);
                }
            }

            var bytes = Encoding.UTF8.GetPreamble()
                .Concat(Encoding.UTF8.GetBytes(csv.ToString()))
                .ToArray();

            return Results.File(bytes, "text/csv; charset=utf-8", "mybooks-exemplares-backup.csv");
        })
        .WithName("ExportCopiesBackup")
        .WithOpenApi();

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

    private static void AppendCsvRow(StringBuilder csv, IEnumerable<string?> values)
    {
        csv.AppendLine(string.Join(",", values.Select(EscapeCsvValue)));
    }

    private static string EscapeCsvValue(string? value)
    {
        if (string.IsNullOrEmpty(value))
        {
            return "";
        }

        var mustQuote = value.Contains(',') || value.Contains('"') || value.Contains('\n') || value.Contains('\r');
        var escaped = value.Replace("\"", "\"\"", StringComparison.Ordinal);

        return mustQuote ? $"\"{escaped}\"" : escaped;
    }

}
