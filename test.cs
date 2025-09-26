using _this = AAA;

public class BBB
{
	public void Start() 
	{
		test();
	}
}

public class AAA
{
    static float 				property 	= "";
	public BBB 					bbb;

    static method() 
	{
		
	}

	// TODO: Fix indentation
	private void test() 
	{
		_this.property 			= "wqwe _this 1213" +  "_this";  
		_this.method			();   

		this.Start				();  

		bbb.Start				(); 			
	}

	// TODO: [Fixed] indentation
	public void Start() 
	{
		test();
	}

	// TODO: [QA] indentation
	private void Start1() 
	{
		test();
	}

	// TODO: [InProgress] indentation
	private void Start2() 
	{
		test();
	}

	// [CRITICAL] indentation
	private void Start2() 
	{
		test();
	}
}