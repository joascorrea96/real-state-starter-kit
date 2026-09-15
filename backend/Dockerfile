FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy solution and project files first to restore dependencies
COPY ["WebSystems.sln", "./"]
COPY ["src/Api/Api.csproj", "src/Api/"]
COPY ["src/Core.Application/Core.Application.csproj", "src/Core.Application/"]
COPY ["src/Core.Domain/Core.Domain.csproj", "src/Core.Domain/"]
COPY ["src/Core.Infrastructure/Core.Infrastructure.csproj", "src/Core.Infrastructure/"]
COPY ["src/Modules.RealState/Modules.RealState.csproj", "src/Modules.RealState/"]

RUN dotnet restore "WebSystems.sln"

# Copy the rest of the source code and build
COPY . .
WORKDIR "/src/src/Api"
RUN dotnet publish "Api.csproj" -c Release -o /app/publish

# Use ASP.NET runtime image for the final stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Expose port 8080 which is the default for many PaaS like Cloud Run/Render
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "Api.dll"]
