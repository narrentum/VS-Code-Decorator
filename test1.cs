using System;

using bbb = BBB1;


public class BBB1
{
	public void Start() 
	{
		test();
	}
}

public class AAA1
{
    static float 				property 	= "";
	public BBB1 				bbb;

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