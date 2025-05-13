import { SocialBookmark , SocialPost } from '../../models/socialMedia/SocialCenter.js'
import { ApiError } from '../../utils/ApiError.js'
import { ApiResponse } from '../../utils/ApiResponse.js'
import { asyncHandler } from '../../utils/asyncHandler.js'


const bookmarkUnBookmarkPost = asyncHandler(async (req,res)=>{
    const {postId} = req.params;
    const post = await SocialPost.findById(postId);

    if(!post){
        throw new ApiError(404,'Post does not exist')
    }
    const isAlreadyBookmarked = await SocialBookmark.findOne(
       {
        postId,
        bookmarkedBy : req.user?.id
        }
    );
    
    if(isAlreadyBookmarked){
        await SocialBookmark.findOneAndDelete({
            postId,
            bookmarkedBy : req.user?.id
        });
        return res.status(200).json(
            new ApiResponse(200,
                {
                    isBookmarked : false
                },
                'Bookmarked removed successfully'
            )
        );
    }
    else{
        await SocialBookmark.create({
            postId,
            bookmarkedBy : req.user?.id,
        });
        return res.status(200).json(
            new ApiResponse(200,{
                isBookmarked : true
            },'Bookmarked successfully')
        );
    }
})

export { bookmarkUnBookmarkPost }