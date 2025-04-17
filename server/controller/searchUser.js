const UserModel = require('../models/UserModel')

async function searchUser(request, response) {
    try {
        const { search } = request.body;
        
        // Base query to exclude admin users
        let query = { isAdmin: { $ne: true } };
        
        // Add search filter if search term is provided
        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), "i");
            query = {
                ...query,
                $or: [
                    { name: searchRegex },
                    { email: searchRegex }
                ]
            };
        }

        const users = await UserModel.find(query)
            .select("-password -__v")
            .sort({ name: 1 }); // Sort by name alphabetically

        return response.json({
            message: users.length ? 'Users found' : 'No users found',
            data: users,
            success: true
        });
    } catch (error) {
        console.error('Search user error:', error);
        return response.status(500).json({
            message: error.message || 'Internal server error',
            error: true
        });
    }
}

module.exports = searchUser