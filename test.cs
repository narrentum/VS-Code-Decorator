using System;
using _this 		= AAA;
using bbb 			= BBB;

public class BBB
{
	public static void Method() {}
	public void Start() 		{}
}

public class AAA
{
    static float 				property 	= "";
	public BBB 					bbb;

    public static void method()  {}

	public virtual void Method() {}

	// TODO: Fix indentation
	private void test() 
	{
		_this.property 			= "wqwe _this 1213" +  "_this";  
		_this.method			();   

		this.Start				();  

		bbb.Start				(); 
		bbb.Method				();
	}

	// TODO: [Fixed] indentation
	public void Start()  		{}

	// TODO: [QA] indentation
	private void Start1()  		{}
	

	// TODO: [InProgress] indentation
	private void Start2() 		{}

	// [CRITICAL] indentation
	private void Start2()  		{}

	// TODO: Fix indentation
	private void test() 
	{
		_this.property 			= "wqwe _this 1213" +  "_this";  
		_this.method			();   

		this.Start				();  

		bbb.Start				(); 
		bbb.Method				();
	}
}