import { Link } from "react-router-dom";
import { BiUser } from "react-icons/bi";
import { AiOutlineUnlock } from "react-icons/ai"

const Login = () => {
    return (
        <div className="bg-slate-800 rounded-md p-8 shadow-lg backdrop-filter backdrop-blur-md bg-opacity-30 relative">
            <div>
                {/* sapce for logo  */}

            </div>
            <div>
                <h1 className="text-4xl font-semibold text-whitefont-bold text-center mb-6">Login</h1>
                <form action="">
                <div className="relative my-4 mb-8">
                     <input type="email" className="block w-72 py-2.4 px-0 text-sm text-white font-semibold bg-transparent border-0 border-b-2 border-emerald-900 appearance-none dark:focus:border-yellow-500 focus:outline-none focus:ring-0 focus:text-black focus:border-blue-600 peer" placeholder=" "/>
                     <label htmlFor="" className="absolute text-white duration-300 transform -translate-y-6 scale-75 top-0 -z-10 origin-[0]  peer-focus:text-yellow-400 peer-focus:dark:text-yellow-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-6">Your Email</label>
                     <BiUser className="absolute top-0 right-4"/>
                </div>
                <div className="relative my-4 mt-8">
                     <input type="password" className="block w-72 py-2.4 px-0 text-sm text-white font-semibold bg-transparent border-0 border-b-2 border-emerald-900 appearance-none dark:focus:border-yellow-500 focus:outline-none focus:ring-0 focus:text-black focus:border-blue-600 peer" placeholder=" "/>
                     <label htmlFor="" className="absolute text-white duration-300 transform -translate-y-6 scale-75 top-0 -z-10 origin-[0]  peer-focus:text-yellow-400 peer-focus:dark:text-yellow-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-6">Your Password</label>
                     <AiOutlineUnlock className="absolute top-0 right-4"/>
                </div>
                <div className="flex justify-between items-center">
                    <Link className="text-yellow-400">Forgot Password?</Link>
                </div>
                <button className="w-full mb-4 text-[18px] font-semibold mt-6 rounded-full bg-white text-black hover:bg-emerald-900 hover:text-white py-2 transition-colors duration-700" type="submit">Login</button>
                <div>
                    <span className="m-4">New Here? <Link className="text-yellow-400"to='Register'>Create an Account</Link></span>
                </div>
                </form>
            </div>
        </div>
    );
};

export default Login;