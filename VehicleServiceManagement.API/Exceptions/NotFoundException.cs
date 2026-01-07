namespace VehicleServiceManagement.API.Exceptions
{
    public class NotFoundException : Exception
    {
        public NotFoundException() : base("Resource not found")
        {
        }

        public NotFoundException(string message) : base(message)
        {
        }

        public NotFoundException(string name, object key) 
            : base($"{name} with id '{key}' was not found")
        {
        }

        public NotFoundException(string message, Exception innerException) 
            : base(message, innerException)
        {
        }
    }
}
