const Footer = () => {
  return (
    <footer className="w-full bg-gray-800 text-white p-4 mt-8">
      <div className="container mx-auto text-center">
        <p>&copy; {new Date().getFullYear()} The PynkSpice. All Rights Reserved.</p>
        <p>
          <a href="https://www.instagram.com/thepynkspice" target="_blank" rel="noopener noreferrer" className="hover:text-pink-400">
            Follow us on Instagram
          </a>
        </p>
        <p>Contact: contact@thepynkspice.com</p>
      </div>
    </footer>
  );
};

export default Footer;
