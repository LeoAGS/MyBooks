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
    await MigrationBootstrapper.MarkLegacyDatabaseAsMigratedAsync(db);
    await MigrationBootstrapper.RemoveLegacyLoanColumnsAsync(db);
    await db.Database.MigrateAsync();
    await SeedData.EnsureSeededAsync(db);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("Frontend");
app.UseHttpsRedirection();

app.MapCatalogEndpoints();
app.MapWorkEndpoints();
app.MapReadingEndpoints();
app.MapCopyEndpoints();

app.Run();
