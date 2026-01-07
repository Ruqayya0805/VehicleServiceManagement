using System.Net;
using System.Text.Json;
using VehicleServiceManagement.API.DTOs.Common;
using VehicleServiceManagement.API.Exceptions;

namespace VehicleServiceManagement.API.Middleware
{
    public class ExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionMiddleware> _logger;

        public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task Invoke(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                await HandleExceptionAsync(context, ex);
            }
        }

        private async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/json";

            var response = new ApiResponse<object>();

            switch (exception)
            {
                case NotFoundException notFoundEx:
                    context.Response.StatusCode = (int)HttpStatusCode.NotFound;
                    response.Success = false;
                    response.Message = notFoundEx.Message;
                    response.Errors = new List<string> { notFoundEx.Message };
                    _logger.LogWarning("Resource not found: {Message}", notFoundEx.Message);
                    break;

                case BadRequestException badRequestEx:
                    context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                    response.Success = false;
                    response.Message = badRequestEx.Message;
                    response.Errors = badRequestEx.Errors;
                    _logger.LogWarning("Bad request: {Message}", badRequestEx.Message);
                    break;

                case UnauthorizedException unauthorizedEx:
                    context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
                    response.Success = false;
                    response.Message = unauthorizedEx.Message;
                    response.Errors = new List<string> { unauthorizedEx.Message };
                    _logger.LogWarning("Unauthorized access: {Message}", unauthorizedEx.Message);
                    break;

                case ForbiddenException forbiddenEx:
                    context.Response.StatusCode = (int)HttpStatusCode.Forbidden;
                    response.Success = false;
                    response.Message = forbiddenEx.Message;
                    response.Errors = new List<string> { forbiddenEx.Message };
                    _logger.LogWarning("Forbidden access: {Message}", forbiddenEx.Message);
                    break;

                case ConflictException conflictEx:
                    context.Response.StatusCode = (int)HttpStatusCode.Conflict;
                    response.Success = false;
                    response.Message = conflictEx.Message;
                    response.Errors = new List<string> { conflictEx.Message };
                    _logger.LogWarning("Resource conflict: {Message}", conflictEx.Message);
                    break;

                default:
                    context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                    response.Success = false;
                    response.Message = "An unexpected error occurred";
                    response.Errors = new List<string> { exception.Message };
                    _logger.LogError(exception, "Unhandled exception: {Message}", exception.Message);
                    break;
            }

            var options = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            };

            await context.Response.WriteAsync(JsonSerializer.Serialize(response, options));
        }
    }
}
