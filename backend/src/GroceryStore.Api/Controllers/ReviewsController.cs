using System.Security.Claims;
using GroceryStore.Api.Contracts;
using GroceryStore.Application.Features.Reviews;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GroceryStore.Api.Controllers;

[ApiController]
[Route("api/reviews")]
public sealed class ReviewsController(ReviewService reviewService) : ControllerBase
{
    [Authorize(Roles = "Buyer")]
    [HttpPost]
    public async Task<ActionResult<ReviewResponse>> CreateAsync(CreateReviewRequest request, CancellationToken cancellationToken) =>
        Ok(await reviewService.CreateAsync(new CreateReviewCommand(request.OnlineOrderItemId, request.Rating, request.Content), User.FindFirstValue(ClaimTypes.NameIdentifier) ?? throw new UnauthorizedAccessException(), cancellationToken));

    [Authorize(Roles = "Admin,Manager")]
    [HttpPut("{reviewId:guid}/reply")]
    public async Task<ActionResult<ReviewResponse>> ReplyAsync(Guid reviewId, ReplyReviewRequest request, CancellationToken cancellationToken) => Ok(await reviewService.ReplyAsync(reviewId, request.Reply, cancellationToken));

    [Authorize(Roles = "Admin,Manager")]
    [HttpPost("{reviewId:guid}/hide")]
    public async Task<ActionResult<ReviewResponse>> HideAsync(Guid reviewId, CancellationToken cancellationToken) => Ok(await reviewService.HideAsync(reviewId, cancellationToken));
}
