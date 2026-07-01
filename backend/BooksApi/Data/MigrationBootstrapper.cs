using Microsoft.EntityFrameworkCore;

public static class MigrationBootstrapper
{
    public static async Task RemoveLegacyLoanColumnsAsync(BooksDbContext db)
    {
        if (!await ColumnExistsAsync(db, "Copies", "IsLoaned"))
        {
            return;
        }

        await db.Database.ExecuteSqlRawAsync("""
            PRAGMA foreign_keys = OFF;

            CREATE TABLE "Copies_new" (
                "Id" TEXT NOT NULL CONSTRAINT "PK_Copies" PRIMARY KEY,
                "WorkId" TEXT NOT NULL,
                "Format" TEXT NOT NULL,
                "Publisher" TEXT NULL,
                "Edition" TEXT NULL,
                "Isbn" TEXT NULL,
                "PublishedYear" INTEGER NULL,
                "Language" TEXT NULL,
                "PageCount" INTEGER NULL,
                "Condition" TEXT NULL,
                "Location" TEXT NULL,
                "AcquisitionDate" TEXT NULL,
                "AcquisitionType" TEXT NOT NULL,
                "PricePaid" TEXT NULL,
                "Currency" TEXT NOT NULL,
                "IsGift" INTEGER NOT NULL,
                "IsSigned" INTEGER NOT NULL,
                "Notes" TEXT NULL,
                "CreatedAt" TEXT NOT NULL,
                "UpdatedAt" TEXT NOT NULL,
                CONSTRAINT "FK_Copies_Works_WorkId" FOREIGN KEY ("WorkId") REFERENCES "Works" ("Id") ON DELETE CASCADE
            );

            INSERT INTO "Copies_new" (
                "Id",
                "WorkId",
                "Format",
                "Publisher",
                "Edition",
                "Isbn",
                "PublishedYear",
                "Language",
                "PageCount",
                "Condition",
                "Location",
                "AcquisitionDate",
                "AcquisitionType",
                "PricePaid",
                "Currency",
                "IsGift",
                "IsSigned",
                "Notes",
                "CreatedAt",
                "UpdatedAt"
            )
            SELECT
                "Id",
                "WorkId",
                "Format",
                "Publisher",
                "Edition",
                "Isbn",
                "PublishedYear",
                "Language",
                "PageCount",
                "Condition",
                "Location",
                "AcquisitionDate",
                "AcquisitionType",
                "PricePaid",
                "Currency",
                "IsGift",
                "IsSigned",
                "Notes",
                "CreatedAt",
                "UpdatedAt"
            FROM "Copies";

            DROP TABLE "Copies";
            ALTER TABLE "Copies_new" RENAME TO "Copies";
            CREATE INDEX "IX_Copies_WorkId" ON "Copies" ("WorkId");

            PRAGMA foreign_keys = ON;
            """);
    }

    public static async Task MarkLegacyDatabaseAsMigratedAsync(BooksDbContext db)
    {
        if (!await TableExistsAsync(db, "Works"))
        {
            return;
        }

        await db.Database.ExecuteSqlRawAsync("""
            CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
                "MigrationId" TEXT NOT NULL CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY,
                "ProductVersion" TEXT NOT NULL
            );
            """);

        if (await MigrationHistoryHasRowsAsync(db))
        {
            return;
        }

        var initialMigration = db.Database.GetMigrations().FirstOrDefault();
        if (initialMigration is null)
        {
            return;
        }

        await db.Database.ExecuteSqlRawAsync(
            """
            INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
            VALUES ({0}, {1});
            """,
            initialMigration,
            "8.0.21");
    }

    private static async Task<bool> TableExistsAsync(BooksDbContext db, string tableName)
    {
        await using var command = db.Database.GetDbConnection().CreateCommand();
        command.CommandText = """
            SELECT COUNT(*)
            FROM sqlite_master
            WHERE type = 'table' AND name = $tableName;
            """;

        var parameter = command.CreateParameter();
        parameter.ParameterName = "$tableName";
        parameter.Value = tableName;
        command.Parameters.Add(parameter);

        if (command.Connection?.State != System.Data.ConnectionState.Open)
        {
            await db.Database.OpenConnectionAsync();
        }

        var result = await command.ExecuteScalarAsync();
        return Convert.ToInt32(result) > 0;
    }

    private static async Task<bool> ColumnExistsAsync(BooksDbContext db, string tableName, string columnName)
    {
        await using var command = db.Database.GetDbConnection().CreateCommand();
        command.CommandText = $"""
            SELECT COUNT(*)
            FROM pragma_table_info('{tableName}')
            WHERE name = $columnName;
            """;

        var parameter = command.CreateParameter();
        parameter.ParameterName = "$columnName";
        parameter.Value = columnName;
        command.Parameters.Add(parameter);

        if (command.Connection?.State != System.Data.ConnectionState.Open)
        {
            await db.Database.OpenConnectionAsync();
        }

        var result = await command.ExecuteScalarAsync();
        return Convert.ToInt32(result) > 0;
    }

    private static async Task<bool> MigrationHistoryHasRowsAsync(BooksDbContext db)
    {
        await using var command = db.Database.GetDbConnection().CreateCommand();
        command.CommandText = """
            SELECT COUNT(*)
            FROM "__EFMigrationsHistory";
            """;

        if (command.Connection?.State != System.Data.ConnectionState.Open)
        {
            await db.Database.OpenConnectionAsync();
        }

        var result = await command.ExecuteScalarAsync();
        return Convert.ToInt32(result) > 0;
    }
}
