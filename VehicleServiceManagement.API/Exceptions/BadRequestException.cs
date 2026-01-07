namespace VehicleServiceManagement.API.Exceptions
{
    public class BadRequestException : Exception
    {
        public List<string> Errors { get; }

        public BadRequestException() : base("Bad request")
        {
            Errors = new List<string>();
        }

        public BadRequestException(string message) : base(message)
        {
            Errors = new List<string> { message };
        }

        public BadRequestException(List<string> errors) : base("One or more validation errors occurred")
        {
            Errors = errors;
        }

        public BadRequestException(string message, Exception innerException) 
            : base(message, innerException)
        {
            Errors = new List<string> { message };
        }
    }
}
