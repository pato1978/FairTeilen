namespace WebAssembly.Server.Helper;

public class FinanceCalculatorHelper
{
    public int CalculatePercentage(int spent, int total)
    {
        if (total == 0) return 0;
        return (int)((double)spent / total * 100);
    }
}